import QtQuick 2.0

Item {
    property bool explosion: false

    Image {
        anchors.fill: parent.center
        height: 30
        width: 30
        source: "qrc:/img/grenade.png"
        visible: !explosion
    }
    SpriteSequence {
        height: 100
        width: 100
        anchors.horizontalCenter: parent.horizontalCenter
        anchors.bottom: parent.bottom
        anchors.bottomMargin: -20
        running: true
        visible: explosion
        Sprite {
            source: "qrc:/img/explosion.png"
            frameX: 0
            frameY: 0
            frameHeight: 256
            frameWidth: 256
            frameCount: 39
            frameRate: 50
        }
    }
}
