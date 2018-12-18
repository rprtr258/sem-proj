#ifndef BULLET_H
#define BULLET_H

#include <QQuickItem>
#include "map.h"
#include "projectile.h"

class Bullet : public Projectile {
    public:
        Bullet(QQuickItem *item, QVector2D direction, Map *map, qint32 damage);
        ~Bullet() override;
        bool update() override;
    private:
        QVector2D m_direction;
        QVector2D m_position;
};

#endif // BULLET_H
