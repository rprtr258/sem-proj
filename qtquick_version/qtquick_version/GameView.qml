import QtQuick 2.0
import QtQuick.Controls 2.4

Item {
    id: item
    anchors.fill: parent
    signal keyPressed(int key, int modifier)
    signal keyReleased(int key, int modifier)
    Rectangle {
        x: 0
        y: 0
        width: 20
        height: 480
        color: "brown"
    }
    Rectangle {
        x: 0
        y: 300
        width: 100
        height: 20
        color: "brown"
    }
    Rectangle {
        x: 620
        y: 0
        width: 20
        height: 480
        color: "brown"
    }
    Rectangle {
        x: 0
        y: 460
        width: 640
        height: 20
        color: "brown"
    }
    Rectangle {
        x: 200
        y: 200
        width: 100
        height: 20
        color: "brown"
    }
    property bool mirrored : false
    Item {
        x: player.x
        y: player.y
        width: 55
        height: 95
        clip: true
        Image {
            objectName: "playerItem"
            x: 0
            y: -28
            source: "qrc:/../../img/hero.png"
        }
    }
    focus: true
    Keys.onPressed: {
        keyPressed(event.key, event.modifier);
    }
    Keys.onReleased: {
        keyReleased(event.key, event.modifier);
    }
}
