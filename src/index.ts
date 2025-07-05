import "dotenv/config";
import { app } from "./services/app";

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => console.log(`server is ready up ${PORT}` )
)