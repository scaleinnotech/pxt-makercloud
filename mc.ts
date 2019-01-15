//% weight=10 color=#008B00 icon="\uf1eb" block="Maker Cloud - DfRobot"
namespace Makercloud_Dfrobot {
    let SERIAL_TX = SerialPin.P2
    let SERIAL_RX = SerialPin.P1
    let PROD_SERVER = "mqtt.makercloud.scaleinnotech.com"
    let SIT_SERVER = "mqtt.makercloud-sit.scaleinnotech.com"
    let SERVER = PROD_SERVER

    let topicHandlerList: TopicHandler[] = []

    export class TopicHandler {
        name: string;
        fn: (message: string) => void;
    }

    export class TopicMessage {
        name: string;
        message: string;
    }

    /**
     * @param SSID to SSID ,eg: "yourSSID"
     * @param PASSWORD to PASSWORD ,eg: "yourPASSWORD"
     */
    //% blockId=mc_df_wifi_setup
    //% block="connect Wi-Fi: | name: %ssid| password: %password"
    export function setupWifi(ssid: string, password: string) {
        serial.writeString("|2|1|" + ssid + "," + password + "|\r")
    }

    /**
     * For testing purpose
     */
    //% blockId=mc_df_change_to_sit
    //% block="Maker Cloud Lab"
    //% advanced=true
    export function changeToSitServer() {
        SERVER = SIT_SERVER
    }

    /**
     * Configuration RX TX Pin
     */
    //% blockId=mc_df_config_rxtx
    //% block="Update Pin: | RX: %rx| TX: %tx"
    //% advanced=true
    export function configRxTxPin(rx: SerialPin, tx: SerialPin) {
        SERIAL_TX = tx
        SERIAL_RX = rx
    }


    /**
     * @param topic ,eg: "topic"
     * @param message ,eg: "message"
     */
    //% blockId=mc_df_publish_message_to_topic
    //% block="tell %topic about %message"
    //% advance=true
    export function publishToTopic(topic: string, message: string) {
        message = "_dsn=" + control.deviceSerialNumber() + ",_dn=" + control.deviceName() + "," + message
        serial.writeString("|4|1|3|" + topic + "|" + message + "|\r");
    }

    /**
     * Connect your device to MQTT Server
     */
    //% blockId=mc_df_connect_mqtt
    //% block="connect mqtt"
    export function connectMqtt() {
        let port = 1883;
        serial.writeString("|4|1|1|" + SERVER + "|" + port + "|" + "username" + "|" + "password" + "|\r")
    }

    /**
     * Subscribe to MQTT topic
     * @param topics to topics ,eg: "ZXY,ABC"
     */
    //% blockId=mc_df_subscribe_topic
    //% block="i want to listen %topics"
    export function subscrbeTopic(topics: string) {
        let topicList = splitMessage(topics, ",")
        let i = 0
        for (i = 0; i < topicList.length; i++) {
            "" + control.deviceSerialNumber() + control.deviceName()
            if (topicList[i] != "") {
                serial.writeString("|4|1|2|" + topicList[i] + "|\r")
            }
        }
    }

    /**
     * Listener for MQTT topic
     * @param topic to topic ,eg: "ZXY"
     */
    //% blockId=mc_df_register_topic_message_handler
    //% block="When something talk to %topic, then"
    export function registerTopicMessageHandler(topic: string, fn: (message: string) => void) {
        let topicHandler = new TopicHandler()
        topicHandler.fn = fn
        topicHandler.name = topic
        topicHandlerList.push(topicHandler)
    }

    /**
     * @param SSID to SSID ,eg: "yourSSID"
     * @param PASSWORD to PASSWORD ,eg: "yourPASSWORD"
     * @param IOT_TOPIC to IOT_TOPIC ,eg: "yourIotTopic"
     */
    //% weight=102
    //% blockId=mc_df_init
    //% block="Initialise Maker Cloud"
    export function init() {
        serial.redirect(
            SERIAL_TX,
            SERIAL_RX,
            BaudRate.BaudRate9600
        )
        ping()
        ping()
        ping()

        serial.onDataReceived("\r", onDataReceivedHandler)
    }

    function handleTopicMessage(topic: string, message: string) {
        let i = 0
        for (i = 0; i < topicHandlerList.length; i++) {
            if (topicHandlerList[i].name == topic) {
                let content: string = extractContentFromMakerCloudMessage(message)
                topicHandlerList[i].fn(content)
                break
            }
        }
    }

    function onDataReceivedHandler(): void {
        let response = serial.readUntil("\r")
        let prefix = response.substr(0, 7)
        if (prefix == "|4|1|5|") {
            let message: string[] = splitMessageOnFirstDelimitor(response.substr(7, response.length - 1), "|")
            handleTopicMessage(message[0], message[1])
        } else {
            // basic.showString("X")
        }
    }

    function ping() {
        serial.writeString("|1|1|\r")
    }


    function splitMessage(message: string, delimitor: string): string[] {
        let messages: string[] = [""];
        let i = 0;
        let messagesIndex = 0;

        for (i = 0; i < message.length; i++) {
            let letter: string = message.charAt(i)
            if (letter == delimitor) {
                messages[++messagesIndex] = ""
            } else {
                messages[messagesIndex] += letter
            }
        }

        return messages
    }

    function extractContentFromMakerCloudMessage(makerCloudMessage: string): string {

        let delimitor = ","
        let numberOfDelimitorToSkip = 2
        let numberOfDelimitorSkipped = 0
        let content = ""
        let i = 0
        for (i = 0; i < makerCloudMessage.length; i++) {
            let letter: string = makerCloudMessage.charAt(i)


            if (numberOfDelimitorSkipped >= numberOfDelimitorToSkip) {
                content += letter
            }

            if (letter == delimitor) {
                numberOfDelimitorSkipped++
            }
        }
        return content;

    }

    function splitMessageOnFirstDelimitor(message: string, delimitor: string): string[] {

        let beforeDelimitor = ""
        let afterDelimitor = ""
        let i = 0
        let delimitorPassed = false
        for (i = 0; i < message.length; i++) {
            let letter: string = message.charAt(i)

            if (letter == delimitor) {
                delimitorPassed = true
                continue
            }

            if (delimitorPassed) {
                afterDelimitor += letter
            } else {
                beforeDelimitor += letter
            }
        }
        return [beforeDelimitor, afterDelimitor];
    }

}