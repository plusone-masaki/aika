import VoiceRepository from './VoiceRepository'

type Repository = {
  voice: VoiceRepository
}

const repositories: Repository = {
  voice: new VoiceRepository(),
}

export default {
  get: (key: keyof Repository) => {
    return repositories[key]
  },
}
