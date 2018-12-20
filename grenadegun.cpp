#include "grenadegun.h"

void GrenadeGun::shoot(Bridge *view, QVector2D mouseCoord, QVector2D playerCoord, Map *map, qint32 ownerId) {
    QQuickItem *grenadeItem = view->createGrenade(playerCoord.toPoint().x(), playerCoord.toPoint().y());
    Grenade *grenade = new Grenade(grenadeItem, mouseCoord - playerCoord, map, m_damage, ownerId);
    view->addCreature(grenade);
}
