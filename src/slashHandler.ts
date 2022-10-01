import { Client, Embed, Guild, Member, TextableChannel, User } from 'eris'

// API request types

export interface ApplicationCommand {
  id?: string
  application_id?: string
  name: string
  description: string
  options?: ApplicationCommandOption[]
}

export interface ApplicationCommandOption {
  type: ApplicationCommandType
  name: string
  description: string
  required?: boolean
  choices?: ApplicationCommandOptionChoice[]
  options?: ApplicationCommandOption[]
  autocomplete?: boolean
}

export enum ApplicationCommandType {
  SUB_COMMAND = 1,
  SUB_COMMAND_GROUP,
  STRING,
  INTEGER,
  BOONEAN,
  USER,
  CHANNEL,
  ROLE
}

export interface ApplicationCommandOptionChoice {
  name: string
  value: string | number
}

export interface InteractionResponse {
  type: InteractionResponseType
  data?: InteractionApplicationCommandCallbackData
}

enum InteractionResponseType {
  pong = 1,
  // Deprecated
  acknowledge,
  // Deprecated
  channelMessage,
  channelMessageWithSource,
  deferredChannelMessageWithSource,
  deferredUpdateMessage,
  updateMessage,
  autocompleteResult,
  modal
}

export interface InteractionApplicationCommandCallbackData {
  tts?: boolean
  content?: string
  embeds?: Embed[]
  allowedMentions?: {
    parse?: string[]
    users?: string[]
    roles?: string[]
    repliedUser?: boolean
  }
  // Set to 64 to make response ephemeral
  flags?: number
}

// Gateway event types

export interface Interaction {
  id: string
  type: InteractionType
  data?: InteractionData
  guild_id?: string
  guild?: Guild
  channel_id?: string
  channel: TextableChannel
  member?: Member
  user?: User
  token: string
  version: number
}

enum InteractionType {
  ping = 1,
  applicationCommand,
  autocomplete = 4
}

export interface InteractionData {
  id: string
  name: string
  options?: InteractionOption[]
}

export interface InteractionOption {
  name: string
  value: unknown
  type: number
  options?: InteractionOption[]
}

interface InteractionHandlerOptions {
  // Should commands be added locally or globally
  development?: boolean
  // ID of the guild to add development commands on
  developmentGuild?: string
}

interface InteractionCallbackOptions {
  // Should we defer the response?
  defer?: boolean
  // Can only the request user see it?
  ephemeral?: boolean
  // The funtion to autocomplete arguments with
  autocomplete?: (_: Interaction) => ApplicationCommandOptionChoice[]
}

type InteractionCallback = (d: Interaction, c: Client) => InteractionApplicationCommandCallbackData | Promise<InteractionApplicationCommandCallbackData>

export function isInteractionPayload (ev: { t: string }): ev is { t: string, d: Interaction } {
  return ev.t === 'INTERACTION_CREATE'
}

/**
 * A very simple wrapper for Discord's interactions. Doesn't do much schema
 * validation and only proxies events and registers commands.
 */
export class InteractionHandler {
  readonly client: Client
  readonly opts: InteractionHandlerOptions
  readonly commandEndpoint: string

  commands = new Map<string, { schema: ApplicationCommand, handler: InteractionCallback, opts: InteractionCallbackOptions }>()

  constructor (client: Client, opts: InteractionHandlerOptions) {
    this.client = client
    this.opts = opts

    // Set API endpoints
    if (this.opts.development) {
      console.debug('InteractionHandler: development enabled. Will add commands to development guild.')
      if (this.opts.developmentGuild === undefined) {
        throw new Error('Development guild ID not provided. Cannot add commands.')
      }
      this.commandEndpoint = `/applications/${this.applicationId}/guilds/${this.opts.developmentGuild}/commands`
    } else {
      this.commandEndpoint = `/applications/${this.applicationId}/commands`
    }

    this.client.on('rawWS', this._websocketHandler.bind(this))
  }

  get applicationId (): string {
    // @ts-expect-error: _token isn't documented
    return this.client.user?.id ?? Buffer.from(this.client._token.split(' ')[1].split('.')[0], 'base64').toString()
  }

  /**
   * Initializes slash commands and syncs list with Discord. All commands should
   * be registered before calling this.
   */
  async init (): Promise<void> {
    // Get all command schema into a nice list
    const commands = []
    for (const [, { schema }] of this.commands) {
      commands.push(schema)
    }
    const req = await this._request('PUT', this.commandEndpoint, commands)
    if (!req.ok) {
      throw new Error(`Unable to register commands ${req.status} ${JSON.stringify(await req.json(), null, 2)}`)
    }
  }

  registerSlash (
    command: ApplicationCommand,
    handler: InteractionCallback,
    opts: InteractionCallbackOptions = {}
  ): this {
    this.commands.set(command.name, { schema: command, handler, opts })
    return this
  }

  async _websocketHandler (ev: { t: string }): Promise<void> {
    if (!isInteractionPayload(ev)) {
      return
    }

    switch (ev.d.type) {
      case InteractionType.applicationCommand: {
        await this.dispatchSlash(ev.d)
        break
      }
      case InteractionType.autocomplete: {
        await this.dispatchAutocomplete(ev.d)
        break
      }
    }
  }

  async dispatchAutocomplete (interaction: Interaction): Promise<void> {
    const { opts } = this.commands.get(interaction.data.name)
    const choices = await opts.autocomplete?.(interaction) ?? []
    await this._request(
      'POST',
      `/interactions/${interaction.id}/${interaction.token}/callback`,
      {
        type: InteractionResponseType.autocompleteResult,
        data: { choices }
      }
    )
  }

  async dispatchSlash (slash: Interaction): Promise<void> {
    slash.user = this.client.users.get(slash.user?.id ?? slash.member.user.id)
    slash.guild = this.client.guilds.get(slash.guild_id)
    slash.channel = slash.guild?.channels?.get(slash.channel_id) as TextableChannel ?? await this.client.getDMChannel(slash.channel_id)
    slash.member = slash.guild?.members?.get(slash.user.id)

    const { handler, opts } = this.commands.get(slash.data.name)
    if (opts.defer) {
      // Defer the command response
      const payload: InteractionResponse = {
        type: InteractionResponseType.deferredChannelMessageWithSource
      }

      if (opts.ephemeral) {
        payload.data = {
          flags: 64
        }
      }

      await this._request(
        'POST',
        `/interactions/${slash.id}/${slash.token}/callback`,
        payload
      )
    }

    const response = await handler(slash, this.client)

    // We need to update the original message if we deferred
    if (opts.defer) {
      const req = await this._request(
        'PATCH',
        `/webhooks/${this.applicationId}/${slash.token}/messages/@original`,
        response
      )
      if (!req.ok) {
        throw new Error(`Interaction response error ${req.status} ${JSON.stringify(await req.json(), null, 2)}`)
      }
    } else {
      const req = await this._request(
        'POST',
        `/interactions/${slash.id}/${slash.token}/callback`,
        {
          type: InteractionResponseType.channelMessageWithSource,
          data: response
        }
      )
      if (!req.ok) {
        throw new Error(`Interaction response error ${req.status} ${JSON.stringify(await req.json(), null, 2)}`)
      }
    }
  }

  async _request (method: string, path: string, body: unknown): Promise<Response> {
    return await fetch('https://discordapp.com/api/v8' + path, {
      method,
      body: body === undefined ? undefined : JSON.stringify(body),
      headers: {
        // @ts-expect-error: _token isn't documented
        Authorization: this.client._token,
        'Content-Type': body === undefined ? undefined : 'application/json',
        'User-Agent': 'DiscordBot (https://github.com/theGordHoard/discord-color-bot)'
      }
    })
  }
}
