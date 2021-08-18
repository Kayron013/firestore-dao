import { JsonProperty, Serializable } from 'typescript-json-serializer';
import { FirestoreDao } from '../src/FirestoreDao/FirestoreDao';
import { db } from './firebase';

/**
 * Sample DAO
 */
@Serializable()
class User extends FirestoreDao {
  constructor(@JsonProperty() public name: string, @JsonProperty() public age: number) {
    super(User.db.collection('users').doc());
  }

  public static get(id: string) {
    return User.fromRef(db.collection('users').doc(id));
  }
}

beforeAll(() => {
  FirestoreDao.setFirestore(db);
});

describe('FirestoreDao - Creating an instance', () => {
  test('Constructor', () => {
    const user = new User('Drake', 25);

    expect(user instanceof User).toBe(true);
    expect(user.name).toBe('Drake');
    expect(user.age).toBe(25);
  });

  test('Serialization', () => {
    const user = User.fromJson({ name: 'Drake', age: 23 });

    expect(user instanceof User).toBe(true);

    const json = user.toJson();
    expect(json).toEqual({ name: 'Drake', age: 23 });
  });
});

describe('FirestoreDao - Persisting', () => {
  test('Create new document', async () => {
    const user = new User('Drake', 25);
    await user.persist();

    const dbUser = await user.docRef.get();
    expect(dbUser.data()).toEqual({ name: 'Drake', age: 25 });
  });

  test('Full update', async () => {
    const docRef = await db.collection('users').add({ name: 'Jacob the Updater', age: 35 });
    const user = await User.get(docRef.id);

    expect(user).toBeDefined();
    if (!user) return;

    user.age = 36;
    user.name = 'Johnny the Updater';
    await user.persist();

    const dbUser = await docRef.get();
    expect(dbUser.data()).toEqual({ name: 'Johnny the Updater', age: 36 });
  });

  test.skip('Partial update', async () => {
    const docRef = await db.collection('users').add({ name: 'Jacob the Updater', age: 35 });
    const user = await User.get(docRef.id);

    expect(user).toBeDefined();
    if (!user) return;

    user.age = 36;
    await user.persist();

    const dbUser = await docRef.get();
    expect(dbUser.data()).toEqual({ name: 'Jacob the Updater', age: 36 });
  });
});

describe('FirestoreDao - Retriving', () => {
  test('Get a document - Class.get()', async () => {
    const docRef = await db.collection('users').add({ name: 'Jacob', age: 35 });
    const user = await User.get(docRef.id);

    expect(user).toBeDefined();
    if (!user) return;

    expect(user.name).toBe('Jacob');
    expect(user.age).toBe(35);
  });

  test('Get a document - docRef', async () => {
    const docRef = await db.collection('users').add({ name: 'Jacob', age: 13 });
    const user = await User.fromRef(docRef);

    expect(user).toBeDefined();
    if (!user) return;

    expect(user.name).toBe('Jacob');
    expect(user.age).toBe(13);
  });

  test('Get a document - string path', async () => {
    const docRef = await db.collection('users').add({ name: 'Jacob', age: 15 });
    const user = await User.fromRef(docRef.path);

    expect(user).toBeDefined();
    if (!user) return;

    expect(user.name).toBe('Jacob');
    expect(user.age).toBe(15);
  });
});

describe('FirestoreDao - Deleting', () => {
  test('Delete a document', async () => {
    const docRef = await db.collection('users').add({ name: 'Jacob', age: 35 });
    const user = await User.get(docRef.id);

    expect(user).toBeDefined();
    if (!user) return;

    await user.unPersist();

    const dbUser = await docRef.get();
    expect(dbUser.exists).toBe(false);
  });
});

describe('FirestoreDao - Subscribing', () => {
  test('Subscribe to a document', async () => {
    const docRef = await db.collection('users').add({ name: 'Jacob', age: 35 });

    const fn = jest.fn((user: User | null) => {});
    const unsubscribe = User.subscribeDoc(docRef, user => {
      fn(user);
    });

    // Test multiple calls to fn

    unsubscribe();
  });
});
