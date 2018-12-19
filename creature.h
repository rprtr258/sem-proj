#ifndef CREATURE_H
#define CREATURE_H

#include <QObject>

class Character;

class Creature {
    public:
        virtual ~Creature();
        /*
         * Returns true if creature should be deleted.
         */
        virtual bool update() = 0;
        virtual void affect(Character *character) {
            Q_UNUSED(character);
        }
};

#endif // CREATURE_H
