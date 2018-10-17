import QtQuick 2.0
import QtQuick.Controls 2.4

Item {
    id: item
    anchors.fill: parent
    signal keyPressed(int key, int modifier)
    signal keyReleased(int key, int modifier)
    Item {
        x: player.x
        y: player.y
        width: 55
        height: 95
        clip: true
        Image {
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
