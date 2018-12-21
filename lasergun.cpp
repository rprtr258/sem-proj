#include "lasergun.h"

LaserGun::LaserGun() {
    m_mana = 45;
}

void LaserGun::shoot(Bridge *view, QVector2D mouseCoord, QVector2D playerCoord, Map *map, qint32 ownerId) {
    QVector2D endPoint = calcEndPoint(mouseCoord, playerCoord, map);
    QQuickItem *laserItem = view->createLaser(endPoint, playerCoord);
    Laser *laser = new Laser(laserItem, playerCoord, endPoint - playerCoord, 20, ownerId);
    view->addCreature(laser);
}

QVector2D LaserGun::calcEndPoint(QVector2D mouseCoord, QVector2D playerCoord, Map *map) {
    QVector2D direction = (mouseCoord - playerCoord).normalized();
    QVector2D position = playerCoord;
    while (!map->isFilled(position.toPoint()) and isInScreen(position))
        position += direction;
    return position;
}

bool LaserGun::isInScreen(QVector2D point) {
    const qint32 topScreenX = 840;
    const qint32 bottomScreenX = -200;
    const qint32 topScreenY = 680;
    const qint32 bottomScreenY = -200;
    return point.x() >= bottomScreenX && point.x() <= topScreenX &&
           point.y() >= bottomScreenY && point.y() <= topScreenY;
}
