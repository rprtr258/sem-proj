#ifndef LASER_H
#define LASER_H

#include <QQuickItem>
#include "projectile.h"

class Laser : public Projectile {
    public:
        Laser(QQuickItem *item, QVector2D direction, qint32 damage, qint32 ownerId);
        ~Laser() override;
        void affect(Character *character) override;
        bool update() override;
    private:
        bool doesIntersect(QPoint b1, QPoint b2) {
            float x00 = m_position.x();
            float y00 = m_position.y();
            float x01 = (m_position + m_direction).x();
            float y01 = (m_position + m_direction).y();
            float x10 = b1.x();
            float y10 = b1.y();
            float x11 = b2.x();
            float y11 = b2.y();
            float d = x11 * y01 - x01 * y11;
            float s = (-1 / d) * ((x00 - x10) * y01 - (y00 - y10) * x01);
            float t = (1 / d) * (-(x00 - x10) * y11 + (y00 - y10) * x11);
            return (0 <= s and s <= 1 and 0 <= t and t <= 1);
        }

    private:
        QVector2D m_direction;
        QVector2D m_position;
        bool m_active = true;
        qint32 m_lifetime;
};

#endif // LASER_H
