require('dotenv').config();
const { VertexAI } = require('@google-cloud/vertexai');

const project = 'cprnd-496814';
const location = 'us-central1';

async function testModel(modelName) {
    console.log(`Testing model: ${modelName}`);
    try {
        const vertex_ai = new VertexAI({ project: project, location: location });
        const generativeModel = vertex_ai.preview.getGenerativeModel({
            model: modelName,
        });

        const request = {
            contents: [{ role: 'user', parts: [{ text: 'Say hello' }] }],
        };

        const streamingResp = await generativeModel.generateContentStream(request);
        const response = await streamingResp.response;
        console.log(`SUCCESS [${modelName}]:`, response.candidates[0].content.parts[0].text);
    } catch (e) {
        console.error(`FAILED [${modelName}]:`, e.message);
    }
}

async function run() {
    await testModel('gemini-1.5-pro-preview-0409');
    await testModel('gemini-1.5-pro-001');
    await testModel('gemini-1.5-flash-001');
    await testModel('gemini-1.0-pro');
    await testModel('gemini-pro');
}

run();
