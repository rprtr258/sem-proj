import QtQuick 2.0

Item {
    property bool mirrored : false

    width: 55
    height: 95
    clip: true
    Image {
        id: sprite
        objectName: "playerItem"
        mirror: mirrored
        x: 0
        y: -28
        source: "qrc:/../../img/hero.png"
    }
}
