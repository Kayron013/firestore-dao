import firebase from 'firebase/app';
import 'firebase/firestore';
import { env } from './env';

firebase.initializeApp({ projectId: 'default' });

export const db = firebase.firestore();
db.useEmulator('localhost', env.FIRESTORE_EMULATOR_PORT);
