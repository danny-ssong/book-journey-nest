// import { DataSource } from 'typeorm';
// import { User } from 'src/users/entities/user.entity';
// import { Profile } from 'src/profiles/entities/profile.entity';
// import * as oldUsers from './data/old_users.json';
// import * as oldProfiles from './data/old_profile.json';
// import { Author } from 'src/authors/entities/author.entity';
// import * as dotenv from 'dotenv';
// import { Post } from 'src/post/entities/post.entity';
// import { Book } from 'src/books/entities/book.entity';

// dotenv.config();

// interface OldProfile {
//   id: string;
//   username: string;
//   imageURL: string | null;
//   bio: string;
//   created_at: string;
//   mostRead_authors: string[];
//   user_id: string;
// }

// interface OldUser {
//   id: string;
//   email: string;
//   raw_user_meta_data: {
//     sub: string;
//     name: string;
//   };
// }

// async function main() {
//   const ds = new DataSource({
//     type: 'postgres',
//     host: 'localhost',
//     port: 5432,
//     username: process.env.DB_USERNAME as string,
//     password: process.env.DB_PASSWORD as string,
//     database: process.env.DB_DATABASE as string,
//     entities: [User, Profile, Author, Book, Post],
//     synchronize: true,
//   });
//   await ds.initialize();

//   const userRepo = ds.getRepository(User);
//   const authorRepo = ds.getRepository(Author);
//   const profileRepo = ds.getRepository(Profile);
//   const profileMap = new Map<string, Profile>();

//   for (const row of oldProfiles as OldProfile[]) {
//     const authorNames: string[] = row.mostRead_authors;
//     const authors: Author[] = [];

//     for (const name of authorNames) {
//       let author = await authorRepo.findOneBy({ name });
//       if (!author) {
//         author = authorRepo.create({ name });
//         await authorRepo.save(author);
//       }
//       authors.push(author);
//     }

//     const profile = profileRepo.create({
//       nickname: row.username,
//       avatarUrl: row.imageURL || undefined,
//       bio: row.bio,
//       createdAt: new Date(row.created_at),
//     });

//     profile.mostReadAuthors = authors;
//     const newProfile = await profileRepo.save(profile);

//     profileMap.set(row.user_id, newProfile);
//   }

//   console.log('✅ profile Migration done!');

//   for (const row of oldUsers as OldUser[]) {
//     const user = userRepo.create({
//       id: row.id,
//       name: row.raw_user_meta_data.name,
//       email: row.email,
//       thirdPartyId: row.raw_user_meta_data.sub,
//       profile: profileMap.get(row.id),
//     });
//     await userRepo.save(user);
//   }

//   console.log('✅ user Migration done!');
//   await ds.destroy();
// }

// main().catch(console.error);
