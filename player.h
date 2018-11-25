#ifndef PLAYER_H
#define PLAYER_H

#include <QObject>
#include <QQuickItem>
#include <QRect>
#include "creature.h"
#include "map.h"
#include "observer.h"
#include "projectile.h"
#include "weapon.h"

class Player : public QObject, public Creature {
    Q_OBJECT
    Q_DISABLE_COPY(Player)

    public:
        Player(Map *map, Observer *view, QQuickItem *item, QPoint position);
        ~Player();

        void goLeft();
        void stopLeft();
        void goRight();
        void stopRight();
        void jump();
        void stopJump();
        void changeWeapon();
        Projectile* attack(qint32 mouseX, qint32 mouseY);

        virtual bool update() override;

        void setX(qint32 value) {
            m_xCoord = value;
        }
        void setY(qint32 value) {
            m_yCoord = value;
        }
        void setHealth(qint32 value) {
            m_health = value;
        }
        void setMana(qint32 value) {
            m_mana = value;
        }
        bool flipped() {
            return m_spriteFlipped;
        }
    private:
        void flipSprite() {
            m_spriteFlipped = not m_spriteFlipped;
        }
        void moveHorizontal(qint32 speed);
        void moveVertical(qint32 speed);
        QVector2D getHandPosition();
    private:
        qint32 m_xCoord;
        qint32 m_yCoord;
        qint32 m_vspeed;
        qint32 m_health;
        qint32 m_mana;
        qint32 m_reload;
        QRect m_boundingBox;
        QQuickItem *m_item;
        Map *m_map;
        Observer *m_view;
        Weapon *m_weapon;
        qint32 m_weaponType;
        bool m_goingLeft;
        bool m_goingRight;
        bool m_jumping;
        bool m_spriteFlipped;
        bool m_inAir = true;
};

#endif // PLAYER_H
