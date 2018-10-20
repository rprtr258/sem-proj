import QtQuick 2.0

Item {
    property bool mirrored : false

    AnimatedSprite {
        id: walkSprite
        source: "qrc:/../../img/hero.png"
        frameCount: 10
        frameX: 0
        frameY: 170
        frameWidth: 54
        frameHeight: 95
        transform: [
            Scale {
                xScale: mirrored ? 1 : -1
            },
            Translate {
                x: mirrored ? 0 : walkSprite.frameWidth
            }
        ]
    }
}
