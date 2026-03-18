import { Kafka } from "kafkajs";
import dotenv from "dotenv";

dotenv.config();

const brokers = process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(",") : ["localhost:9092"];

export const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || "reyu-diamond-app",
  brokers: brokers,
});
