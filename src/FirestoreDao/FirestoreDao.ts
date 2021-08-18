import firebase from 'firebase';
import { deserialize, serialize } from 'typescript-json-serializer';

export class FirestoreDao {
  protected static db: firebase.firestore.Firestore;

  public static setFirestore(firestore: firebase.firestore.Firestore) {
    this.db = firestore;
  }

  public static fromJson<T extends FirestoreDao>(this: Class<T>, json: Object, docRef?: DocRef): T {
    const instance = deserialize(json, this);
    if (docRef) {
      instance._docRef = docRef;
    }
    return instance;
  }

  public static async get<T extends FirestoreDao>(this: Class<T>, params: Object): Promise<any> {
    throw 'Not Implemented';
  }

  public static async fromRef<T extends FirestoreDao>(this: Class<T>, docRef: DocRef | string): Promise<T | null> {
    const ref = FirestoreDao.toRef(docRef);
    const data = (await ref.get()).data();
    return data ? ((this as unknown as typeof FirestoreDao).fromJson(data) as T) : null;
  }

  private static toRef(docRef: string | DocRef): firebase.firestore.DocumentReference {
    return docRef instanceof firebase.firestore.DocumentReference ? docRef : this.db.doc(docRef);
  }

  public static subscribeList<T extends FirestoreDao>(query: Query, callback: (data: T[]) => any): () => void {
    return query.onSnapshot(snapshot => {
      const data = snapshot.docs.map(doc => this.fromJson(doc.data()) as T);
      callback(data);
    });
  }

  public static subscribeDoc<T extends FirestoreDao>(
    this: Class<T>,
    docRef: DocRef,
    callback: (data: T | null) => any
  ): () => void {
    return docRef.onSnapshot(doc => {
      const data = doc.data();
      const instance = data ? ((this as unknown as typeof FirestoreDao).fromJson(data) as T) : null;
      callback(instance);
    });
  }

  public constructor(protected _docRef: DocRef) {}

  public get docRef() {
    return this._docRef;
  }

  public toJson(): Object {
    return serialize(this);
  }

  public persist({ partial = false }: IPersistOpts = {}): Promise<void> {
    if (partial) {
      return this.docRef.update(this.toJson());
    }
    return this.docRef.set(this.toJson());
  }

  public unPersist(): Promise<void> {
    return this.docRef.delete();
  }
}

type Class<T> = { new (...args: any[]): T };

// Firestore Types

type DocRef = firebase.firestore.DocumentReference;
type Query = firebase.firestore.Query;

// Method Property Types

interface IPersistOpts {
  partial?: boolean;
}

type SubscribeList<T> = (query: Query, callback: (data: T[]) => any) => () => void;
type SubscribeDoc<T> = (query: DocRef, callback: (data: T) => any) => () => void;
type Subscribe<T> = SubscribeDoc<T> | SubscribeList<T>;
