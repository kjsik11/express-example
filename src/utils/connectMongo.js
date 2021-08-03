import { MongoClient } from 'mongodb';

const mongoUri = process.env.MONGODB_URI;
const mongoName = process.env.MONGODB_NAME;

if (!mongoUri) throw Error('There is no mongoUri');
if (!mongoName) throw Error('There is no mongoName');

export async function connectMongo() {
  try {
    const client = await MongoClient.connect(mongoUri);

    client.db(mongoName);
  } catch (err) {
    throw Error(err);
  }
}
