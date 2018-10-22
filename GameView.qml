import QtQuick 2.0
import QtQuick.Controls 2.4

Item {
    id: item
    anchors.fill: parent
    signal keyPressed(int key, int modifier)
    signal keyReleased(int key, int modifier)
    signal worldUpdate()
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
    Player {
        id: playerItem
        x: player.x
        y: player.y
        mirrored: player.flipped
        going: player.going
    }
    focus: true
    Keys.onPressed: {
        keyPressed(event.key, event.modifier);
    }
    Keys.onReleased: {
        keyReleased(event.key, event.modifier);
    }
//    Connections {
//        target: item
//        onKeyPressed: {
//            if (key == Qt.Key_A || key == Qt.Key_D) {
//                playerItem.run()
//            }
//        }
//    }
//    Connections {
//        target: item
//        onKeyReleased: {
//            if (key == Qt.Key_A || key == Qt.Key_D) {
//                playerItem.stop()
//            }
//        }
//    }
//    Component {
//        id: projectileGenerator
//        Projectile {}
//    }
    Timer {
        id: worldTimer
        interval: 20
        repeat: true
        running: true
        onTriggered: {
            worldUpdate();
//            projectileGenerator.createObject(item, {
//                x: cx,
//                y: cy
//            });
        }
    }
}
