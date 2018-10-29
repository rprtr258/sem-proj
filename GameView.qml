import QtQuick 2.0
import QtQuick.Controls 2.4

Item {
    id: item
    anchors.fill: parent
    signal keyPressed(int key, int modifier)
    signal keyReleased(int key, int modifier)
    signal worldUpdate()
    signal mouseMoved(int mouseX, int mouseY)
    signal mousePressed(int mouseX, int mouseY)
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
        inAir: player.inAir
    }
    focus: true
    Keys.onPressed: {
        keyPressed(event.key, event.modifier);
    }
    Keys.onReleased: {
        keyReleased(event.key, event.modifier);
    }
    MouseArea {
        anchors.fill: parent
        hoverEnabled: true
        onPositionChanged: {
            mouseMoved(mouseX, mouseY)
        }
        onPressed: {
            mousePressed(mouseX, mouseY)
        }
        id: ma
    }
    Image {
        id: aim
        source: "qrc:/img/aim.png"
        x: ma.mouseX - width / 2
        y: ma.mouseY - height / 2
    }
    Timer {
        id: worldTimer
        interval: 20
        repeat: true
        running: true
        onTriggered: {
            worldUpdate();
        }
    }
    function createBullet(xxx, yyy) {
        var comp = Qt.createComponent("Bullet.qml")
        var sprite = comp.createObject(item)
        sprite.x = xxx
        sprite.y = yyy
        return sprite
    }
}
