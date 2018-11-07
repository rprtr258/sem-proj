import QtQuick 2.0

Item {
    id: item

    Path {
        id: p
        startX: 0;
        startY: 0;
    }
/*
    Rectangle {
        id: r
        property alias rotationAngle: rRotation.angle

        anchors.centerIn: parent
        height: 10
        width: 1000
        color: "black"


        transform: Rotation {
                id: rRotation

                origin { x: r; y: hand }
                Behavior on angle {
                    SpringAnimation { spring: 2; damping: 0.3; modulus: 360 }
                }
            }
    }
*/
}
