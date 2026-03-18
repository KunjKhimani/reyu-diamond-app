import { kafka } from "../config/kafka.config.js";
import type { Producer, Consumer, Admin, EachMessageHandler } from "kafkajs";

class KafkaService {
  private producer: Producer;
  private consumer: Consumer;
  private admin: Admin;

  constructor() {
    this.producer = kafka.producer();
    this.consumer = kafka.consumer({ groupId: process.env.KAFKA_GROUP_ID || "reyu-diamond-group" });
    this.admin = kafka.admin();
  }

  async connect() {
    try {
      await this.producer.connect();
      await this.consumer.connect();
      await this.admin.connect();
      console.log("Kafka Connected Successfully");
      
      // Ensure notification topic exists with 3 partitions
      await this.createTopic("notification-events", 3);
    } catch (error) {
      console.error("Error connecting to Kafka:", error);
    }
  }

  async createTopic(topic: string, numPartitions: number = 3) {
    try {
      const topics = await this.admin.listTopics();
      if (!topics.includes(topic)) {
        await this.admin.createTopics({
          topics: [{ topic, numPartitions }],
        });
        console.log(`Topic '${topic}' created with ${numPartitions} partitions.`);
      }
    } catch (error) {
      console.error(`Error creating topic ${topic}:`, error);
    }
  }

  async produce(topic: string, message: any) {
    try {
      await this.producer.send({
        topic,
        messages: [{ value: JSON.stringify(message) }],
      });
      // console.log(`Message produced to topic ${topic}`);
    } catch (error) {
      console.error(`Error producing to topic ${topic}:`, error);
    }
  }

  async subscribe(topic: string, onMessage: EachMessageHandler, concurrency: number = 3) {
    try {
      await this.consumer.subscribe({ topic, fromBeginning: true });
      await this.consumer.run({
        partitionsConsumedConcurrently: concurrency,
        eachMessage: onMessage,
      });
      console.log(`Subscribed to topic: ${topic} with concurrency: ${concurrency}`);
    } catch (error) {
      console.error(`Error subscribing to topic ${topic}:`, error);
    }
  }

  async disconnect() {
    await this.producer.disconnect();
    await this.consumer.disconnect();
    await this.admin.disconnect();
  }
}

export const kafkaService = new KafkaService();
export default kafkaService;
