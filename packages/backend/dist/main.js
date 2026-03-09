"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const api_1 = __importDefault(require("./routes/api"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '50mb' })); // Allow large text payloads
app.use('/api', api_1.default);
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Learniverse Backend Running' });
});
app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
});
