// Sets up the API client for interacting with your backend. 
// For your API reference, visit: https://docs.gadget.dev/api/blinds-in-my-home
import { Client } from "@gadget-client/blinds-in-my-home";

export const api = new Client({ environment: window.gadgetConfig.environment });
