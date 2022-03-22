import Realm from 'realm';

import RepositorySchema from '../schemas/RepositorySchema';

export function getRealm() {
  return Realm.open({
    schema: [RepositorySchema],
  });
}
