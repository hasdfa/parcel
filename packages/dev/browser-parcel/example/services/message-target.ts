import { uuidv4 } from './nanoid';

export class MessageTarget {
  receive: any;
  post: any;
  constructor(receive: any, post: any) {
    this.receive = receive;
    this.post = post;
  }
  postMessage(...args: any[]): void {
    this.post.postMessage(...args);
  }
  addEventListener(...args: any[]): void {
    this.receive.addEventListener(...args);
  }
  removeEventListener(...args: any[]): void {
    this.receive.removeEventListener(...args);
  }
  sendMsg(type: string, data?: any, transfer?: Transferable[]): Promise<any> {
    let id = uuidv4();
    return new Promise(res => {
      let handler = (evt: MessageEvent) => {
        if (evt.data.id === id) {
          this.removeEventListener('message', handler);
          res(evt.data.data);
        }
      };
      this.addEventListener('message', handler);
      this.postMessage({type, data, id}, transfer);
    });
  }

  public static async fromServiceWorker() {
    let { active: serviceWorker } = await navigator.serviceWorker.ready;
    return new MessageTarget(navigator.serviceWorker, serviceWorker);
  }
}

