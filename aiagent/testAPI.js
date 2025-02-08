const axios = require("axios");
const { app } = require("./dist/chatbot");

const PORT = process.env.PORT || 3001;

async function runTests() {
  // Start listening in-process
  const server = app.listen(PORT, () => {
    console.log(`Test server listening on port ${PORT}...`);
  });

  try {
    console.log("\n1) Testing /api/initialize...");
    const initRes = await axios.post(`http://localhost:${PORT}/api/initialize`);
    console.log("Response:", initRes.data);

    console.log("\n2) Testing /api/chat...");
    const chatRes = await axios.post(`http://localhost:${PORT}/api/chat`, {
      userMessage: "Hello from the test script!",
    });
    console.log("Response:", chatRes.data);

    console.log("\n3) Testing /api/auto...");
    const autoRes = await axios.post(`http://localhost:${PORT}/api/auto`);
    console.log("Response:", autoRes.data);

    console.log("\nAll tests finished!");
  } catch (err) {
    console.error("\nAn error occurred during tests:", err?.response?.data || err);
  } finally {
    // Shut down the server after tests complete
    server.close(() => {
      console.log("Test server shut down.");
    });
  }
}

runTests();
