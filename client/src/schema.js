import { KeyMap, Schema } from '@orbit/data';
import { JSONAPISerializer } from '@orbit/jsonapi';


export class CustomJSONAPISerializer extends JSONAPISerializer {
  resourceKey(type) {
    return 'remoteId';
  }
}

export const keyMap = new KeyMap();

export const schema = new Schema({
  models: {
    todo: {
      attributes: {
        uuid: { type: 'string' },
        name: { type: 'string' },
        done: { type: 'boolean' },
        deleted: { type: 'boolean' }
      },
      keys: {
        remoteId: { type: 'string' }
      }
    },
  }
});
