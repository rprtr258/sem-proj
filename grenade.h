#ifndef GRENADE_H
#define GRENADE_H

#include <QQuickItem>
#include "map.h"
#include "projectile.h"

class Grenade : public Projectile {
    public:
        Grenade(QQuickItem *item, QVector2D direction, Map *map, qint32 damage, qint32 ownerId);
        ~Grenade() override;
        void affect(Character *character) override;
        bool update() override;
    private:
        int m_dieCounter = -1;
        QVector2D m_position;
        QVector2D m_speed;
};

#endif // GRENADE_H
