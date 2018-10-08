#ifndef RECTANGLE_H
#define RECTANGLE_H


class Rectangle {
    public:
        Rectangle();

        void moveHorizontal(const int &dx);
        void moveVertical(const int &dy);

    public:
        int left, right, top, bottom;
};

#endif // RECTANGLE_H
