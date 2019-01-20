//% weight=10 color=#008B00 icon="\uf1eb" block="Maker Cloud - DfRobot"
namespace Makercloud_Dfrobot {
    let SERIAL_TX = SerialPin.P2
    let SERIAL_RX = SerialPin.P1
    let PROD_SERVER = "mqtt.makercloud.scaleinnotech.com"
    let SIT_SERVER = "mqtt.makercloud-sit.scaleinnotech.com"
    let SERVER = PROD_SERVER

    let stringMessageHandlerList: StringMessageHandler[] = []
    let keyValueMessageHandlerList: KeyValueMessageHandler[] = []

    export class StringMessageHandler {
        topicName: string;
        fn: (stringMessage: string) => void;
    }

    export class KeyValueMessageHandler {
        topicName: string;
        fn: (key: string, value: string) => void;
    }

    export class KeyValueMessage {
        key: string;
        value: string;
    }

    export class MakerCloudMessage {
        deviceName: string;
        deviceSerialNumber: string;
        rawMessage: string;
        stringMessageList: string[];
        keyValueMessagList: KeyValueMessage[];
    }

    //% advanced=true shim=MakerCloud::setTxBufferSize
    function setTxBufferSize(size: number): void {
        return
    }

    //% advanced=true shim=MakerCloud::setRxBufferSize
    function setRxBufferSize(size: number): void {
        return
    }

    /**
     * @param SSID to SSID ,eg: "yourSSID"
     * @param PASSWORD to PASSWORD ,eg: "yourPASSWORD"
     */
    //% blockId=mc_df_wifi_setup
    //% block="connect Wi-Fi: | name: %ssid| password: %password"
    export function setupWifi(ssid: string, password: string) {
        serial.writeString("|2|1|" + ssid + "," + password + "|\r")
        showLoading(7000)
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

    export function showLoading(time: number) {
        let internal = time / 5;
        basic.showLeds(`
            # . . . .
            . . . . .
            . . . . .
            . . . . .
            . . . . .
            `)
        basic.pause(internal)

        basic.showLeds(`
            # # . . .
            . . . . .
            . . . . .
            . . . . .
            . . . . .
            `)
        basic.pause(internal)

        basic.showLeds(`
            # # . . .
            . . . . .
            . . . . .
            . . . . .
            . . . . .
            `)
        basic.pause(internal)

        basic.showLeds(`
            # # # . .
            . . . . .
            . . . . .
            . . . . .
            . . . . .
            `)
        basic.pause(internal)

        basic.showLeds(`
            # # # # #
            . . . . .
            . . . . .
            . . . . .
            . . . . .
            `)
        basic.pause(internal)
        basic.showString("")
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
        showLoading(1000);
    }

    /**
     * Subscribe to MQTT topic
     * @param topics to topics ,eg: "ZXY,ABC"
     */
    //% blockId=mc_df_subscribe_topic
    //% block="i want to listen to %topics"
    export function subscrbeTopic(topics: string) {
        let topicList = splitMessage(topics, ",")
        let i = 0
        for (i = 0; i < topicList.length; i++) {
            if (topicList[i] != "") {
                serial.writeString("|4|1|2|" + topicList[i] + "|\r")
            }
        }
    }

    /**
     * Listener for MQTT topic
     * @param topic to topic ,eg: "ZXY"
     */
    //% blockId=mc_df_register_topic_text_message_handler
    //% block="When something talk to %topic, then"
    export function registerTopicMessageHandler(topic: string, fn: (textMessage: string) => void) {
        let topicHandler = new StringMessageHandler()
        topicHandler.fn = fn
        topicHandler.topicName = topic
        stringMessageHandlerList.push(topicHandler)
    }

    /**
     * Listener for MQTT topic
     * @param topic to topic ,eg: "ZXY"
     */
    //% blockId=mc_df_register_topic_key_value_message_handler
    //% block="When something talk to %topic, then"
    export function registerTopicKeyValueMessageHandler(topic: string, fn: (key: string, value: string) => void) {
        let topicHandler = new KeyValueMessageHandler()
        topicHandler.fn = fn
        topicHandler.topicName = topic
        keyValueMessageHandlerList.push(topicHandler)
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

        setTxBufferSize(300)
        setRxBufferSize(300)
        ping()
        ping()
        ping()

        showLoading(500)
        serial.onDataReceived("\r", onDataReceivedHandler)
    }

    function handleTopicStringMessage(topic: string, stringMessageList: string[]) {
        let i = 0
        for (i = 0; i < stringMessageHandlerList.length; i++) {
            if (stringMessageHandlerList[i].topicName == topic) {
                let j = 0;
                for (j = 0; j < stringMessageList.length; j++) {
                    stringMessageHandlerList[i].fn(stringMessageList[j]);
                }
                break
            }
        }
    }

    function handleTopicKeyValueMessage(topic: string, keyValueMessageList: KeyValueMessage[]) {
        let i = 0
        for (i = 0; i < keyValueMessageHandlerList.length; i++) {
            if (keyValueMessageHandlerList[i].topicName == topic) {
                let j = 0;
                for (j = 0; j < keyValueMessageList.length; j++) {
                    keyValueMessageHandlerList[i].fn(keyValueMessageList[j].key, keyValueMessageList[j].value);
                }
                break
            }
        }
    }

    function onDataReceivedHandler(): void {
        let response = serial.readUntil("\r")
        let prefix = response.substr(0, 7)
        if (prefix == "|4|1|5|") {
            let message: string[] = splitMessageOnFirstDelimitor(response.substr(7, response.length - 1), "|")
            let makerCloudMessage = parseMakerCloudMessage(message[1]);
            handleTopicStringMessage(message[0], makerCloudMessage.stringMessageList)
            handleTopicKeyValueMessage(message[0], makerCloudMessage.keyValueMessagList)
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

    export function parseMakerCloudMessage(topicMessage: string): MakerCloudMessage {
        let makerCloudMessage = new MakerCloudMessage();
        makerCloudMessage.rawMessage = topicMessage;
        makerCloudMessage.deviceName = "";
        makerCloudMessage.deviceSerialNumber = "";
        makerCloudMessage.keyValueMessagList = [];
        makerCloudMessage.stringMessageList = [];

        let delimitor = ",";
        let start = 0;
        let oldMessage: string = topicMessage;

        let i = 0;
        let total = countDelimitor(oldMessage, delimitor);
        for (i = 0; i <= total; i++) {
            let end = oldMessage.indexOf(delimitor);
            if (end == -1) {
                end = oldMessage.length
            }
            let subMessage = oldMessage.substr(0, end);
            if (subMessage.indexOf("=") == -1) {
                makerCloudMessage.stringMessageList[makerCloudMessage.stringMessageList.length] = subMessage
            } else {
                let splitIndex = subMessage.indexOf("=");
                let key = subMessage.substr(0, splitIndex);
                let value = subMessage.substr(splitIndex + 1)

                if (value.length > 0) {
                    if (key == "_dsn") {
                        makerCloudMessage.deviceSerialNumber = value;
                    } else if (key == "_dn") {
                        makerCloudMessage.deviceName = value;
                    } else {
                        let keyValue = new KeyValueMessage();
                        keyValue.key = key;
                        keyValue.value = value;
                        makerCloudMessage.keyValueMessagList[makerCloudMessage.keyValueMessagList.length] = keyValue;
                    }
                }
            }
            oldMessage = oldMessage.substr(end + 1, oldMessage.length);
        }

        return makerCloudMessage;
    }

    export function countDelimitor(msg: string, delimitor: string): number {
        let count: number = 0;
        let i = 0;
        for (i = 0; i < msg.length; i++) {
            if (msg.charAt(i) == delimitor) {
                count++;
            }
        }
        return count;
    }

    export function test() {
        let msg = parseMakerCloudMessage("_dsn=446565559,_dn=tagot,a");
        serial.writeLine("deviceName=" + msg.deviceName)
        serial.writeLine("deviceSerialNumber=" + msg.deviceSerialNumber)
        serial.writeLine("rawMessage=" + msg.rawMessage)
        serial.writeLine("keyValueMessagList.length=" + msg.keyValueMessagList.length)
        serial.writeLine("stringMessageList.length=" + msg.stringMessageList.length)
        let i = 0;
        for (i = 0; i < msg.keyValueMessagList.length; i++) {
            serial.writeLine("keyValueMessagList:" + i + ", key=" + msg.keyValueMessagList[i].key + ",value=" + msg.keyValueMessagList[i].value);
        }
        i = 0;
        for (i = 0; i < msg.stringMessageList.length; i++) {
            serial.writeLine("stringMessageList:" + i + ",value=" + msg.stringMessageList[i]);
        }

        serial.writeLine("end");
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