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

    Image {
        source: "qrc:/img/back.png"
    }

//    Rectangle { // background
//        x: 0
//        y: 0
//        width: 640
//        height: 480
//        color: "violet"
//    }
//    Rectangle { // bottom wall
//        x: 0
//        y: 460
//        width: 640
//        height: 20
//        color: "brown"
//    }
//    Rectangle { // left platform
//        x: 0
//        y: 274
//        width: 167
//        height: 20
//        color: "brown"
//    }
//    Rectangle { // right platform
//        x: 473
//        y: 274
//        width: 167
//        height: 20
//        color: "brown"
//    }
//    Rectangle { // top platform
//        x: 256
//        y: 113
//        width: 128
//        height: 20
//        color: "brown"
//    }
//    Rectangle { // central platform
//        x: 310
//        y: 132
//        width: 20
//        height: 150
//        color: "brown"
//    }
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
        cursorShape: Qt.BlankCursor
        onPositionChanged: {
            mouseMoved(mouseX, mouseY)
        }
        onPressed: {
            mousePressed(mouseX, mouseY)
        }
        onDoubleClicked: {
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
    function createCharacter(posX, posY) {
        var comp = Qt.createComponent("Player.qml")
        var character = comp.createObject(item)
        character.x = posX
        character.y = posY
        return character
    }
    function createBot(posX, posY) {
        var comp = Qt.createComponent("Bot.qml")
        var character = comp.createObject(item)
        character.x = posX
        character.y = posY
        return character
    }
    function createLaser(finishX, finishY, playerX, playerY) {
        var comp = Qt.createComponent("Laser.qml")
        var sprite = comp.createObject(item)
        sprite.finishX = finishX
        sprite.finishY = finishY
        sprite.playerX = playerX
        sprite.playerY = playerY
        return sprite
    }
    function createGrenade(bulletX, bulletY) {
        var comp = Qt.createComponent("Grenade.qml")
        var sprite = comp.createObject(item)
        sprite.x = bulletX
        sprite.y = bulletY
        return sprite
    }
    function createBullet(bulletX, bulletY) {
        var comp = Qt.createComponent("Bullet.qml")
        var sprite = comp.createObject(item)
        sprite.x = bulletX
        sprite.y = bulletY
        return sprite
    }
}
