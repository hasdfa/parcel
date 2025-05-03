import { observable, reaction } from 'mobx'

export const emitter = observable<{
  // esbuild is just loaded, should rebuild now
  ready: boolean
  // notify to reload esbuild by version, triggering "status" and "ready"
  reload: string
  // show status message
  status: string
}>({
  ready: false,
  reload: '',
  status: '',
})

reaction(() => emitter.reload, (version) => {
  console.log('emitter::reload', version)
})

reaction(() => emitter.ready, (ready) => {
  console.log('emitter::ready', ready)
})

reaction(() => emitter.status, (status) => {
  console.log('emitter::status', status)
})
