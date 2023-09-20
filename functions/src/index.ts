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

import functions = require("firebase-functions");
import axios from "axios";
const KEYWORD = functions.config().line.keyword;
const LINE_MESSAGING_API = functions.config().line.messagingapi;
const LINE_HEADER = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${functions.config().line.channelaccesstoken}`
};
import { Configuration, OpenAIApi } from "openai";
const configuration = new Configuration({
    apiKey: functions.config().openai.token
});
const openai = new OpenAIApi(configuration);


exports.LineWebhook = functions.region("asia-northeast1").https.onRequest(async (req: any, res: any) => {
    const events = req.body.events;
    for (const event of events) {
        // Chatbot จะทำงานเฉพาะข้อความ Text ที่ถูกส่งออกมาจากกลุ่มไลน์เท่านั้น
        if (event.source.type === "group" && event.type === "message" && event.message.type === "text") {
            const message = event.message.text;
            // วิธีการเรียกให้ Chatbot ทำงานในกลุ่มไลน์คือพิมพ์ จ่าวิส:...
            if (message.includes(KEYWORD)) {
                // แกะเอาคำถามที่อยู่หลัง : เพื่อส่งให้ ChatGPT
                const question = message.split(":")[1];
                const response = await openaiRequest(question);
                const payload = {
                    type: "text",
                    text: response
                };
                await reply(event.replyToken, payload);
            }
        }
    }
    return res.end();
});

// เรียกใช้งาน ChatGPT-3
const openaiRequest = async (message: string) => {
    const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
            {
                role: "user",
                content: message
            }
        ]
    });
    console.log(JSON.stringify(completion.data));
    return completion.data.choices[0].message?.content;
};

const reply = async (replyToken: string, payload: { type: string; text: string | undefined }) => {
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
