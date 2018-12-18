#ifndef GRENADE_H
#define GRENADE_H

#include <QQuickItem>
#include "map.h"
#include "projectile.h"

class Grenade : public Projectile {
    public:
        Grenade(QQuickItem *item, QVector2D direction, Map *map, qint32 damage);
        ~Grenade() override;
        bool update() override;
    private:
        QVector2D m_position;
        QVector2D m_speed;
};

#endif // GRENADE_H
