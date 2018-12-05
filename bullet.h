#ifndef BULLET_H
#define BULLET_H

#include <QQuickItem>
#include "map.h"
#include "projectile.h"

class Bullet : public Projectile {
    public:
        Bullet(QQuickItem *item, QVector2D direction, Map *map);
        ~Bullet() override;
        bool update() override;
    private:
        QQuickItem* m_item = nullptr;
        QVector2D m_direction;
        QVector2D m_position;
        bool m_died = false;
        qint32 m_ttl = 5;
        Map *m_map;
};

#endif // BULLET_H
