import QtQuick 2.0
import org.examples 1.0

Item {
    Bullet {
        id: cppObj
    }
    Rectangle {
        id: r
        anchors.centerIn: parent
        height: 10
        width: 10
        color: "black"
    }
    Behavior on x {
        NumberAnimation {
            target: r
            property: "x"
            duration: 200
        }
    }
}
