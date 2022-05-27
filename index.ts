import app from "./app";

const port = 8080;

app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at https://localhost:${port}`);
});
