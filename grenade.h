#ifndef GRENADE_H
#define GRENADE_H

#include <QQuickItem>
#include "map.h"
#include "projectile.h"

class Grenade : public Projectile {
    public:
        Grenade(QQuickItem *item, QVector2D mouseCoord, QVector2D playerCoord, Map *map);
        virtual ~Grenade() override;
        virtual bool update() override;
        void setSpeed(QVector2D speed);
    private:
        QQuickItem *m_item;
        QVector2D m_position;
        QVector2D m_speed;
        Map *m_map;
};

#endif // GRENADE_H
