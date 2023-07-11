/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// import {onRequest} from "firebase-functions/v2/https";
// import * as logger from "firebase-functions/logger";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

const functions = require("firebase-functions");
const axios = require("axios");
const LINE_MESSAGING_API = "https://api.line.me/v2/bot";
const LINE_HEADER = {
    "Content-Type": "application/json",
    Authorization: "Bearer WBx2HaUdrw2NW2RCizYfRiKA2O/aiwKkuL4xXJK5vsuTe8cEhOLwMdWJ/zUmtkh23/MTXf4tRIvnGvrTOvjO98Y+0TrHJ5U4yzCaRYjBP84bsn/mJvKeQftFSdfh4uQELBF/kEhg2Bh2hDzi5MLAvQdB04t89/1O/w1cDnyilFU="
};
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
    apiKey: "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",
});
const openai = new OpenAIApi(configuration);


exports.LineWebhook = functions.region("asia-northeast1").https.onRequest(async (req: any, res: any) => {
    const events = req.body.events;
    for (const event of events) {
        // Chatbot จะทำงานเฉพาะข้อความ Text ที่ถูกส่งออกมาจากกลุ่มไลน์เท่านั้น
        if (event.source.type === "group" && event.type === "message" && event.message.type === "text") {
            const message = event.message.text;
            // วิธีการเรียกให้ Chatbot ทำงานในกลุ่มไลน์คือพิมพ์ จ่าวิส:... 
            if (message.includes('จ่าวิส')) {
                // แกะเอาคำถามที่อยู่หลัง : เพื่อส่งให้ ChatGPT
                const question = message.split(':')[1];
                const response = await openaiRequest(question);
                const payload = {
                    type: "text",
                    text: response,
                };
                await reply(event.replyToken, payload);
            }
        }
    }
    return res.end();
});

// เรียกใช้งาน ChatGPT-3 
const openaiRequest = async (message: { role: string; content: any }[]) => {
    const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
            {
                role: "user",
                content: message,
            },
        ],
    });
    console.log(JSON.stringify(completion.data));
    return completion.data.choices[0].message.content;
}

const reply = async (replyToken: string, payload: { type: string; text: any }) => {
    await axios({
        method: "post",
        url: `${LINE_MESSAGING_API}/message/reply`,
        headers: LINE_HEADER,
        data: JSON.stringify({
            replyToken: replyToken,
            messages: [payload]
        })
    });
};