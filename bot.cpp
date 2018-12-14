#include "bot.h"
#include <QVariant>
#include <iostream>
#include <QStateMachine>

//QStateMachine machine;
//QState *activeAttack = new QState;
//QState *activeGoingLeft = new QState;
//QState *activeGoingRight = new QState;
//QState *activeSafePlaceStand = new QState;
//QState *activeSafePlaceGoingLeft = new QState;
//QState *activeSafePlaceGoingRight = new QState;
//QState *respawn = new QState;
//QState *active = new QState;
//QState *activeGoing = new QState;
//QState *activeSafePlace = new QState;

qint32 newSign(const qint32 &x) {
    return (x > 0) - (x < 0);
}

Bot::Bot(Map *worldMap, Observer *view, QQuickItem *item, QPoint *playerPosition, QPoint botPosition, Weapon *weapon,QVector<Creature*> *updateList) {
    m_item = item;
    m_health = 100;
    m_mana = 100;
    m_reload = 0;
    m_goingLeft = m_goingRight = false;
    m_vspeed = 0;
    m_map = worldMap;
    m_boundingBox = QRect(botPosition.x(), botPosition.y(), 55, 95);
    m_spriteFlipped = false;
    m_weapon = weapon;
    m_view = view;
    m_coord = QPoint(botPosition.x(), botPosition.y());
    m_playerCoord = playerPosition;
    m_updateList = updateList;
    m_standTime = 20;
}

void Bot::goLeft() {
    if (not m_goingLeft) {
        m_goingLeft = true;
        goingChangingNotified = false;
    }
}

void Bot::stopLeft() {
    m_goingLeft = false;
    goingChangingNotified = false;
}

void Bot::goRight() {
    if (not m_goingRight) {
        m_goingRight = true;
        goingChangingNotified = false;
    }
}

void Bot::stopRight() {
    m_goingRight = false;
    goingChangingNotified = false;
}

void Bot::jump() {
    m_jumping = true;
}

void Bot::stopJump() {
    m_jumping = false;
}

bool isInScreen(QVector2D point) {
    const qint32 topScreenX = 640;
    const qint32 bottomScreenX = 0;
    const qint32 topScreenY = 480;
    const qint32 bottomScreenY = 0;
    return point.x() >= bottomScreenX && point.x() <= topScreenX &&
            point.y() >= bottomScreenY && point.y() <= topScreenY;
}

bool isInPlayerBoundingBox(QVector2D playerCoord, QVector2D point) {
    return point.x() >= playerCoord.x() && point.x() <= playerCoord.x() + 55 &&
            point.y() >= playerCoord.y() && point.y() <= playerCoord.y() + 95;
}

bool Bot::isHeroVisible(QPoint playerPosition, QPoint botPosition) {
    QVector2D botCoord = QVector2D(botPosition.x(), botPosition.y());
    QVector2D playerCoord = QVector2D(playerPosition.x(), playerPosition.y());
    QVector2D ofset = QVector2D(27, 47);
    QVector2D direction = (playerCoord + ofset - botCoord).normalized();
    if (direction == QVector2D(0,0)) {
        return true;
    }

    QVector2D position = botCoord;
    while (!m_map->isFilled(position.toPoint()) && isInScreen(position)) {
        position += direction;
        if (isInPlayerBoundingBox(playerCoord, position)) {
            return true;
        }
    }
    return false;
}

bool Bot::isWall() {
    QRect boundingBox = QRect(m_boundingBox.x() - 1, m_boundingBox.y() - 1, m_boundingBox.width() + 2, m_boundingBox.height());
    return m_map->isFilled(boundingBox);
}

/*bool Bot::thereIsSafePlace(QPoint &safePlaceCoord, QPoint playerCoord, QPoint botCoord) {
    QPoint leftPoint = QPoint(botCoord.x() + 27, botCoord.y() + 47);
    QPoint rightPoint = QPoint(botCoord.x() + 27, botCoord.y() + 47);

    if (!isHeroVisible(playerCoord, botCoord)) {
        leftPoint.setX(leftPoint.x() - 10);
        rightPoint.setY(rightPoint.x() + 10);
    }

    bool isLeftPoint = false;
    bool isRightPoint = false;
    bool isCross = false;

    int rightCoordLeftPoint = leftPoint.x();
    int leftCoordLeftPoint = leftPoint.x();
    while (not(m_map->isFilled(QRect((leftPoint - QPoint(27,47)).x() - 5, (leftPoint -  QPoint(27,47)).y(), 55, 95)))) {
        leftPoint.setX(leftPoint.x() - 5);
        if (isCross && isHeroVisible(leftPoint, playerCoord)) {
            leftCoordLeftPoint = leftPoint.x();
            isCross = false;
    //        std::cout << leftCoordLeftPoint <<"LeftCoord\n";
            break;
        }
        if (!isHeroVisible(leftPoint, playerCoord) && !isCross) {
            isLeftPoint = true;
            isCross = true;
            rightCoordLeftPoint = leftPoint.x();
      //      std::cout << rightCoordLeftPoint <<"RightCoord\n";
        }
    }

    if (isCross && (leftPoint.x() == 47)) {
        leftCoordLeftPoint = 47;
        isCross = false;
    }

    int rightCoordRightPoint = rightPoint.x();
    int leftCoordRightPoint = rightPoint.x();
    while (not(m_map->isFilled(QRect((rightPoint - QPoint(27,47)).x() + 5, (rightPoint - QPoint(27,47)).y(), 55, 95)))) {
        rightPoint.setX(rightPoint.x() + 5);

        if (isHeroVisible(rightPoint, playerCoord) && isCross) {
            rightCoordRightPoint = rightPoint.x();
            isCross = false;
            break;
        }

        if (!isHeroVisible(rightPoint, playerCoord) && !isCross) {
            isRightPoint = true;
            isCross = true;
            leftCoordRightPoint = rightPoint.x();
            break;
        }
    }

    if (isCross && (rightPoint.x() == 593)) {
        rightCoordRightPoint = 593;
        isCross = false;
    }

    int leftSafePoint = (rightCoordLeftPoint - 27 + leftCoordLeftPoint - 27) / 2;
    int rightSafePoint = (rightCoordRightPoint - 27 + leftCoordRightPoint - 27) / 2;

    std::cout << "safepoint coord1:  " << leftSafePoint << "\n";
    std::cout << "safepoint coord2:  " << rightSafePoint << "\n";
    if (isLeftPoint) {
        if (isRightPoint) {
            if (abs(botCoord.x() - leftSafePoint) < (abs(botCoord.x() - rightSafePoint))) {
                safePlaceCoord = QPoint(leftSafePoint, leftPoint.y() - 47);
            } else {
                safePlaceCoord = QPoint(rightSafePoint, rightPoint.y() - 47);
            }
        } else {
            safePlaceCoord = QPoint(leftSafePoint, leftPoint.y() - 47);
        }

        return true;
    } else if (isRightPoint) {
        safePlaceCoord = QPoint(rightSafePoint, rightPoint.y() - 47);
        return true;
    }
    return false;
}*/

bool Bot::canAttack() {
    return isHeroVisible(*m_playerCoord, m_coord) && (m_mana > 0) && (m_reload <= 0);
}

void Bot::moveHorizontal(qint32 speed) {
    qint32 dx = speed;
    qint32 delta = newSign(speed);
    QRect newRect = m_boundingBox.translated(dx, 0);
    while (m_map->isFilled(newRect) and dx != 0) {
        dx -= delta;
        newRect.translate(-delta, 0);
    }
    if (dx == 0)
        return;
    setX(m_coord.x() + dx);
    m_boundingBox.translate(dx, 0);


    m_item->setX(m_coord.x());
    m_item->setY(m_coord.y());
    m_item->setProperty("going", going());
}

void Bot::moveVertical(qint32 speed) {
    qint32 dy = speed;
    qint32 delta = newSign(speed);
    QRect newRect = m_boundingBox.translated(0, dy);
    while (m_map->isFilled(newRect) and dy != 0) {
        dy -= delta;
        newRect.translate(0, -delta);
        m_vspeed = 0;
    }
    if (dy == 0)
        return;
    if (not inAir())
        setInAir(true);
    setY(m_coord.y() + dy);
    m_boundingBox.translate(0, dy);
}

Projectile* Bot::attack(qint32 mouseX, qint32 mouseY) {
    if (m_reload <= 0) {
        setReload(30);

        QVector2D startCoord = getHandPosition();
        return m_weapon->shoot(m_view, QVector2D(mouseX, mouseY), startCoord, m_map);
    }
    return nullptr;
}

QVector2D Bot::getHandPosition() {
    const int offsetX1 = 47;
    const int offsetX2 = 8;
    const int offsetY = 25;

    if (m_spriteFlipped) {
        return QVector2D(m_coord.x() + offsetX2, m_coord.y() + offsetY);
    } else {
        return QVector2D(m_coord.x() + offsetX1, m_coord.y() + offsetY);
    }
}


enum BotState {
    Attack,
    Stand,
    GoingLeft,
    GoingRight,
    Respawn
};

static BotState state = Respawn;
static BotState lastActivity = Respawn;
static QPoint point;

bool Bot::update() {
    switch (state) {
    case(Respawn): {
        setReload(std::max(m_reload - 1, 0));
        if (m_map->isFilled(m_boundingBox.translated(0, 1))) {
            m_inAir = false;

            flipSprite();
            state = GoingLeft;
        }

        moveVertical(10 - m_vspeed);
        m_vspeed = std::max(m_vspeed - 1, 0);

        m_item->setX(m_coord.x());
        m_item->setY(m_coord.y());

        m_item->setProperty("going", going());
        m_item->setProperty("inAir", inAir());
        m_item->setProperty("health", health());
        m_item->setProperty("mana", mana());
        if (not goingChangingNotified) {
            emit goingChanged();
            goingChangingNotified = true;
        }
        break;
    }
    case(GoingLeft): {
        setReload(std::max(m_reload - 1, 0));
        lastActivity = GoingLeft;
        m_goingLeft = true;
        moveHorizontal(-5);

        if (m_mana <= 0) {
            if ((m_coord.x() == 25)) {
                stopLeft();
                state = Stand;
                break;
            }

            if (isWall()) {
                m_goingLeft = false;
                flipSprite();
                state = GoingRight;
            }
        }

        if (canAttack()) {
            state = Attack;
        }

        if (isWall()) {
            m_goingLeft = false;
            flipSprite();
            state = GoingRight;
        }

        m_item->setProperty("mirrored", flipped());
        if (not goingChangingNotified) {
            emit goingChanged();
            goingChangingNotified = true;
        }
        break;
    }
    case(GoingRight): {
        lastActivity = GoingRight;
        m_goingRight = true;
        moveHorizontal(5);
        setReload(std::max(m_reload - 1, 0));

        if (m_mana <= 0) {
            if ((m_coord.x() == 560)) {
                stopRight();
                state = Stand;
            }

            if (isWall()) {
                stopRight();
                flipSprite();
                state = GoingLeft;
            }
        }

        if (canAttack()) {
            state = Attack;
        }

        m_item->setProperty("going", going());

        if (isWall()) {
            m_goingRight = false;
            flipSprite();
            state = GoingLeft;
        }

        if (not goingChangingNotified) {
            emit goingChanged();
            goingChangingNotified = true;
        }

        break;
    }

    case(Attack): {
        setMana(m_mana - 30);
        m_updateList->push_back(attack(m_playerCoord->x() + 27, m_playerCoord->y() + 40));
        m_item->setProperty("mana", mana());
        state = lastActivity;
        break;
    }

    case(Stand): {
        setMana(m_mana + 3);
        stopLeft();
        stopRight();
        m_item->setProperty("going", going());
        m_item->setProperty("mana", mana());
        changeStandTime(-2);

        if (m_standTime <= 0) {
            changeStandTime(20);
            if (m_mana > 50 && canAttack()) {
                state = Attack;
            } else if (m_mana == 100) {
                state = lastActivity;
            }
        }
    }
        break;
    }
    return false;
}
