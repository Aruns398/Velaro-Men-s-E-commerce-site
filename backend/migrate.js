require('dotenv').config();
const { MongoClient } = require('mongoose').mongo;

async function migrate() {
  const localUri = 'mongodb://127.0.0.1:27017/velaro_groom_shop';
  const atlasUri = process.env.MONGO_URI;

  if (atlasUri.includes('<db_password>')) {
    console.error('ERROR: You need to replace <db_password> in your .env file with your actual password first!');
    process.exit(1);
  }

  console.log('Connecting to local MongoDB...');
  const localClient = new MongoClient(localUri);
  await localClient.connect();
  const localDb = localClient.db();

  console.log('Connecting to Atlas MongoDB...');
  const atlasClient = new MongoClient(atlasUri);
  await atlasClient.connect();
  const atlasDb = atlasClient.db();

  console.log('Fetching collections from local DB...');
  const collections = await localDb.listCollections().toArray();

  for (const collInfo of collections) {
    const collName = collInfo.name;
    console.log(`\nProcessing collection: ${collName}`);

    const localColl = localDb.collection(collName);
    const atlasColl = atlasDb.collection(collName);

    const docs = await localColl.find({}).toArray();
    console.log(`Found ${docs.length} documents in ${collName}.`);

    if (docs.length > 0) {
      console.log(`Inserting into Atlas...`);
      // Delete existing documents in the atlas collection to avoid duplicates (optional, but safe for a fresh migration)
      await atlasColl.deleteMany({});
      await atlasColl.insertMany(docs);
      console.log(`Successfully migrated ${docs.length} documents for ${collName}.`);
    } else {
      console.log(`Skipping empty collection ${collName}.`);
    }
  }

  console.log('\nMigration completed successfully!');
  await localClient.close();
  await atlasClient.close();
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
