import { app } from "./chatbot";

/***************************************************
 * Start server
 ***************************************************/
const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export default app;
