import QtQuick 2.0

Item {
    property int finishX
    property int finishY
    property int playerX
    property int playerY

    height: 700
    width: 700

    Canvas {
        anchors.fill: parent
        onPaint: {
            var ctx = getContext("2d")
            ctx.lineWidth = 6;
            ctx.strokeStyle = "red"
            ctx.beginPath()
            ctx.moveTo(playerX, playerY)
            ctx.lineTo(finishX, finishY)
            ctx.stroke()
        }
    }
}
