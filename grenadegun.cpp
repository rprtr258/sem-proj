#include "grenadegun.h"

Grenade* GrenadeGun::shoot(Observer *view, QVector2D mouseCoord, QVector2D playerCoord, Map &map) {
    QQuickItem *grenadeItem = view->createGrenade((qint32)playerCoord.x(), (qint32)playerCoord.y());
    return new Grenade(grenadeItem, mouseCoord, playerCoord, map);
}
