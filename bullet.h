#ifndef BULLET_H
#define BULLET_H

#include <QQuickItem>

#include "creature.h"

class Bullet : public Creature {
    public:
        Bullet(QQuickItem *item);
        virtual ~Bullet();

        void update();
    private:
        QQuickItem *m_item = nullptr;
        QVector2D m_direction;
        QVector2D m_position;
};

#endif // BULLET_H
