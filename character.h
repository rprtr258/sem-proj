#ifndef CHARACTER_H
#define CHARACTER_H

#include <QObject>
#include <QQuickItem>
#include <QRect>
#include "creature.h"
#include "map.h"
#include "observer.h"
#include "projectile.h"
#include "weapon.h"

class Character : public Creature {
    public:
        Character(Map *map, Bridge *view, QQuickItem *item, QPoint position);
        virtual ~Character() override;

        virtual void goLeft();
        virtual void stopLeft();
        virtual void goRight();
        virtual void stopRight();
        virtual void jump();
        virtual void changeWeapon();
        virtual void attack(qint32 mouseX, qint32 mouseY);

        virtual void hit(qreal value);
        void respawn(qint32 x, qint32 y);
        virtual bool flipped() {
            return m_spriteFlipped;
        }

        virtual QRect getBoundingBox() {
            return m_boundingBox;
        }
        qint32 getId() {
            return m_id;
        }

        qreal getHealth() {
            return m_health;
        }
        void addKill() {
            m_score++;
        }

        virtual bool update() override;
    protected:
        virtual void flipSprite() {
            m_spriteFlipped = not m_spriteFlipped;
        }
        virtual void moveHorizontal(qint32 speed);
        virtual void moveVertical(qint32 speed);
        virtual QVector2D getHandPosition();
    protected:
        qint32 m_id;
        QPoint m_coord;
        qint32 m_vspeed;
        qreal m_health;
        qreal m_mana;
        qint32 m_score = 0;
        qint32 m_reload;
        QRect m_boundingBox;
        QQuickItem *m_item;
        Map *m_map;
        Bridge *m_view;
        Weapon *m_weapon;
        qint32 m_weaponType;
        bool m_goingLeft;
        bool m_goingRight;
        bool m_spriteFlipped;
        bool m_inAir = true;
};

#endif // CHARACTER_H
