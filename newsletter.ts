import dotenv from "dotenv";
import { createTransport } from 'nodemailer';
import { MongoClient } from 'mongodb';
import { MailOptions } from 'nodemailer/lib/smtp-pool';
import * as readline from "node:readline";
import fs from "fs";
import path from "node:path";


dotenv.config();
const email ="playpokemonmanager@gmail.com"
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
let version = '0';
const transporter = createTransport({
  service: "gmail",
  auth: {
    user: email,
    pass: process.env.EMAIL_PASSWORD,
  },
});

rl.question('Version de la newsletter : ', (input) => {
  version = input;
  if (version) {
    console.log(`Version : ${version}`);
    sendNewsletter();
    rl.close();
  } else {
    console.log('Erreur: Vous n\'avez pas entré un chiffre valide.');
    process.exit()
  }
});

function sendNewsletter() {

  if (process.argv[2]) {
    let content = fs.readFileSync(
        path.join(
            __dirname.replace("\\dist", ""),
            `templates/${version}/newsletter#${version}_${process.argv[2]}.html`,
        ),
        "utf-8",
    );
    content = content.replace("username", "UserTest");
    const mailOption: MailOptions = {
      from: email,
      html: content,
      to: email,
      subject: `Newsletter #${version}`
    }
    transporter.sendMail(mailOption).then();
  } else {


    const mongoURI =
        !("1" === process.env.MONGODB_LOCAL) &&
        process.env.MONGODB_USERNAME &&
        process.env.MONGODB_PASSWORD
            ? `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0.1eldau8.mongodb.net`
            : "mongodb://127.0.0.1:27017";

    const client = new MongoClient(
        mongoURI
    );

    client.connect().then(async (client) => {
      const db = client.db("PokemonManager");
      const users = await db.collection("user").find({subscribeToNewsletter: true}).toArray()
      users.forEach((user) => {
        let content = fs.readFileSync(
            path.join(
                __dirname.replace("\\dist", ""),
                `templates/${version}/newsletter#${version}_${user.lang}.html`,
            ),
            "utf-8",
        );
        content = content.replace("username", "UserTest");
        const mailOption: MailOptions = {
          from: email,
          html: content,
          to: user.email,
          subject: `Newsletter #${version}`
        }
        transporter.sendMail(mailOption).then();
      })
    })
  }
}
